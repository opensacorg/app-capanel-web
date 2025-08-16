import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { ComboBox } from "../ui/input/ComboBox";
import { useDebounce } from "../../hooks/useDebounce";

// Types for the School API
interface SchoolSummary {
	id: string;
	school: string | null;
	city: string | null;
	county: string | null;
	cds_code: string | null;
}

interface SchoolsSummaryResponse {
	data: SchoolSummary[];
	count: number;
}

// API call to fetch schools
const fetchSchoolsSummary = async (query: string): Promise<SchoolsSummaryResponse> => {
	const params = new URLSearchParams();
	if (query) {
		params.append('q', query);
	}
	params.append('limit', '10');
	
	const response = await fetch(`/api/v1/schools/summary?${params}`);
	if (!response.ok) {
		throw new Error('Failed to fetch schools');
	}
	return response.json();
};


function useSearchHomepageForm(opts?: {
	onSubmit?: (data: { schoolOrDistrict: string; location: string }, results: SchoolSummary[]) => void;
}) {
	const form = useForm({
		defaultValues: {
			schoolOrDistrict: "",
			location: "",
		},
		onSubmit: async ({ value }) => {
			console.log("Form submitted with:", value);
			// Fetch results based on the search
			try {
				const response = await fetchSchoolsSummary(value.schoolOrDistrict);
				opts?.onSubmit?.(value, response.data);
			} catch (error) {
				console.error('Error fetching schools:', error);
				opts?.onSubmit?.(value, []);
			}
		},
	});

	return form;
}

export default function SearchHomepageForm() {
	const [schoolQuery, setSchoolQuery] = useState("");
	const [locationQuery, setLocationQuery] = useState("");
	const [results, setResults] = useState<SchoolSummary[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	
	// Debounce the search queries
	const debouncedSchoolQuery = useDebounce(schoolQuery, 300);
	const debouncedLocationQuery = useDebounce(locationQuery, 300);
	
	// Fetch school options based on the debounced query
	const { data: schoolsResponse } = useQuery({
		queryKey: ["schools", debouncedSchoolQuery],
		queryFn: () => fetchSchoolsSummary(debouncedSchoolQuery),
		enabled: debouncedSchoolQuery.length > 0,
	});
	
	// Fetch location options (using same API for now, can be customized)
	const { data: locationsResponse } = useQuery({
		queryKey: ["locations", debouncedLocationQuery],
		queryFn: () => fetchSchoolsSummary(debouncedLocationQuery),
		enabled: debouncedLocationQuery.length > 0,
	});
	
	// Extract school names for autocomplete
	const schoolOptions = schoolsResponse?.data.map(s => s.school || "").filter(Boolean) || [];
	const locationOptions = locationsResponse?.data.map(s => `${s.city || ""}, ${s.county || ""}`.trim()).filter(Boolean) || [];
	
	const form = useSearchHomepageForm({
		onSubmit: (data, searchResults) => {
			setResults(searchResults);
			setHasSearched(true);
		},
	});

	return (
		<>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="flex items-center gap-4 pb-8"
			>
				<form.Field
					name="schoolOrDistrict"
					validators={{
						onChange: ({ value }) =>
							!value ? "Please enter a school or district." : undefined,
					}}
				>
					{(field) => (
						<ComboBox
							field={field}
							options={schoolOptions}
							placeholder="Enter a school or district"
							label="School or District"
							onInputChange={setSchoolQuery}
						/>
					)}
				</form.Field>
				<form.Field
					name="location"
					validators={{
						onChange: ({ value }) =>
							!value ? "Please enter a location." : undefined,
					}}
				>
					{(field) => (
						<ComboBox
							field={field}
							options={locationOptions}
							placeholder="Enter a location"
							label="Location"
							onInputChange={setLocationQuery}
						/>
					)}
				</form.Field>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<button
							className="button-primary"
							type="submit"
							disabled={!canSubmit}
						>
							{isSubmitting ? "Searching..." : "Search"}
						</button>
					)}
				</form.Subscribe>
			</form>
			
			{/* Results Display */}
			{hasSearched && (
				<div className="mt-8">
					{results.length > 0 ? (
						<>
							<h3 className="text-lg font-semibold mb-4">Search Results ({results.length} schools found)</h3>
							<div className="space-y-3">
								{results.map((school) => (
									<div 
										key={school.id} 
										className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
									>
										<div className="font-medium text-lg text-gray-900">
											{school.school || "Unnamed School"}
										</div>
										<div className="text-sm text-gray-600 mt-1">
											<span className="font-medium">Location:</span> {school.city || "N/A"}, {school.county || "N/A"}
										</div>
										{school.cds_code && (
											<div className="text-sm text-gray-500 mt-1">
												<span className="font-medium">CDS Code:</span> {school.cds_code}
											</div>
										)}
									</div>
								))}
							</div>
						</>
					) : (
						<div className="text-gray-500 text-center py-8">
							No schools found matching your search criteria.
						</div>
					)}
				</div>
			)}
		</>
	);
}
